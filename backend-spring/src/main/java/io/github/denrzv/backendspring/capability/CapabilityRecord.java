package io.github.denrzv.backendspring.capability;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicBoolean;

public class CapabilityRecord {
  public final String capabilityId;
  public final String userId;
  public final String eventType;
  public final String clientId;
  public final String phone;
  public final String sourceMf;
  public final Instant expiresAt;
  public final AtomicBoolean used = new AtomicBoolean(false);

  public CapabilityRecord(
    String capabilityId,
    String userId,
    String eventType,
    String clientId,
    String phone,
    String sourceMf,
    Instant expiresAt
  ) {
    this.capabilityId = capabilityId;
    this.userId = userId;
    this.eventType = eventType;
    this.clientId = clientId;
    this.phone = phone;
    this.sourceMf = sourceMf;
    this.expiresAt = expiresAt;
  }
}