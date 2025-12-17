package io.github.denrzv.backendspring.capability;

import io.github.denrzv.backendspring.api.CapabilityIssueRequest;
import io.github.denrzv.backendspring.errors.ApiException;
import io.github.denrzv.backendspring.ratelimit.SlidingWindowRateLimiter;
import io.github.denrzv.backendspring.security.UserContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CapabilityService {
  private static final Logger log = LoggerFactory.getLogger(CapabilityService.class);

  private static final Duration TTL = Duration.ofSeconds(30);

  private final SlidingWindowRateLimiter limiter;
  private final Map<String, CapabilityRecord> store = new ConcurrentHashMap<>();

  public CapabilityService(SlidingWindowRateLimiter capabilityIssueLimiter) {
    this.limiter = capabilityIssueLimiter;
  }

  public CapabilityRecord issue(UserContext user, CapabilityIssueRequest req) {
    validateIssueRequest(req);

    // Rate limit per user
    if (!limiter.tryAcquire(user.userId())) {
      log.warn("CAPABILITY_DENY rate_limit userId={}", user.userId());
      throw ApiException.tooMany("RATE_LIMIT", "Too many capability requests. Try later.");
    }

    // RBAC
    if (!roleCanInitiateCallback(user.role())) {
      log.warn("CAPABILITY_DENY rbac userId={} role={}", user.userId(), user.role());
      throw ApiException.forbidden("RBAC_DENY", "Role is not allowed to initiate callback.");
    }

    // ABAC (демо-правило: разрешаем звонок только клиентам C-1xx)
    if (!isAllowedClientForUser(req.clientId(), user)) {
      log.warn("CAPABILITY_DENY abac userId={} role={} clientId={}", user.userId(), user.role(), req.clientId());
      throw ApiException.forbidden("ABAC_DENY", "User is not allowed to call this client.");
    }

    String capId = "cap-" + UUID.randomUUID();
    Instant expiresAt = Instant.now().plus(TTL);

    CapabilityRecord record = new CapabilityRecord(
      capId,
      user.userId(),
      req.eventType(),
      req.clientId(),
      req.phone(),
      req.sourceMf(),
      expiresAt
    );

    store.put(capId, record);

    log.info("CAPABILITY_ISSUED userId={} role={} capId={} eventType={} clientId={} sourceMf={} exp={}",
      user.userId(), user.role(), capId, req.eventType(), req.clientId(), req.sourceMf(), expiresAt);

    return record;
  }

  public CapabilityRecord consumeOrThrow(UserContext user, String capabilityId, String eventType, String clientId, String phone) {
    if (capabilityId == null || capabilityId.isBlank()) {
      throw ApiException.badRequest("CAPABILITY_MISSING", "Capability is required.");
    }

    CapabilityRecord rec = store.get(capabilityId);
    if (rec == null) {
      throw ApiException.forbidden("CAPABILITY_INVALID", "Capability is invalid.");
    }

    if (!rec.userId.equals(user.userId())) {
      throw ApiException.forbidden("CAPABILITY_USER_MISMATCH", "Capability does not belong to this user.");
    }

    if (Instant.now().isAfter(rec.expiresAt)) {
      throw ApiException.forbidden("CAPABILITY_EXPIRED", "Capability is expired.");
    }

    if (!rec.eventType.equals(eventType)) {
      throw ApiException.badRequest("CAPABILITY_EVENT_MISMATCH", "Capability eventType mismatch.");
    }

    if (!rec.clientId.equals(clientId) || !rec.phone.equals(phone)) {
      throw ApiException.badRequest("CAPABILITY_PAYLOAD_MISMATCH", "Capability payload mismatch.");
    }

    // одноразовость
    if (!rec.used.compareAndSet(false, true)) {
      throw ApiException.conflict("CAPABILITY_REPLAY", "Capability already used.");
    }

    return rec;
  }

  private static void validateIssueRequest(CapabilityIssueRequest req) {
    if (req == null) throw ApiException.badRequest("REQ_INVALID", "Request is required.");
    if (isBlank(req.eventType())) throw ApiException.badRequest("REQ_INVALID", "eventType is required.");
    if (isBlank(req.clientId())) throw ApiException.badRequest("REQ_INVALID", "clientId is required.");
    if (isBlank(req.phone())) throw ApiException.badRequest("REQ_INVALID", "phone is required.");
    if (isBlank(req.sourceMf())) throw ApiException.badRequest("REQ_INVALID", "sourceMf is required.");
  }

  private static boolean roleCanInitiateCallback(String role) {
    return "OPERATOR".equalsIgnoreCase(role) || "SUPERVISOR".equalsIgnoreCase(role);
  }

  private static boolean isAllowedClientForUser(String clientId, UserContext user) {
    // демо: OPERATOR/SUPERVISOR могут только C-1xx
    return clientId != null && clientId.startsWith("C-1");
  }

  private static boolean isBlank(String s) {
    return s == null || s.isBlank();
  }
}