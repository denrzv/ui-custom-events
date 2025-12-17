package io.github.denrzv.backendspring.controllers;

import io.github.denrzv.backendspring.api.CallbackActionRequest;
import io.github.denrzv.backendspring.api.CallbackActionResponse;
import io.github.denrzv.backendspring.capability.CapabilityRecord;
import io.github.denrzv.backendspring.capability.CapabilityService;
import io.github.denrzv.backendspring.errors.ApiException;
import io.github.denrzv.backendspring.security.UserContext;
import io.github.denrzv.backendspring.security.UserContextResolver;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/actions")
public class ActionsController {
  private static final Logger log = LoggerFactory.getLogger(ActionsController.class);

  private final CapabilityService capabilityService;
  private final UserContextResolver resolver;

  public ActionsController(CapabilityService capabilityService, UserContextResolver resolver) {
    this.capabilityService = capabilityService;
    this.resolver = resolver;
  }

  @PostMapping("/callback")
  public CallbackActionResponse callback(@RequestBody CallbackActionRequest req, HttpServletRequest http) {
    UserContext user = resolver.resolve(http);

    if (req == null) throw ApiException.badRequest("REQ_INVALID", "Request is required.");
    if (req.clientId() == null || req.clientId().isBlank()) throw ApiException.badRequest("REQ_INVALID", "clientId is required.");
    if (req.phone() == null || req.phone().isBlank()) throw ApiException.badRequest("REQ_INVALID", "phone is required.");

    // “защищаемый тип события” — для демо фиксируем crm:callback
    CapabilityRecord cap = capabilityService.consumeOrThrow(
      user,
      req.capability(),
      "crm:callback",
      req.clientId(),
      req.phone()
    );

    // Доп. RBAC/ABAC defense-in-depth (можно оставить как проверку роли)
    // В реальности: доменная проверка, client access, DNC и т.д.
    // Здесь просто лог + "успешно".
    String callId = "CALL-" + UUID.randomUUID();

    log.info("CALLBACK_OK userId={} role={} callId={} clientId={} phone={} sourceMf={}",
      user.userId(), user.role(), callId, req.clientId(), req.phone(), cap.sourceMf);

    return new CallbackActionResponse("OK", callId);
  }
}