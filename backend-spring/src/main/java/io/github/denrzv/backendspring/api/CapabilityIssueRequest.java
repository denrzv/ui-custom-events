package io.github.denrzv.backendspring.api;

public record CapabilityIssueRequest(
  String eventType,
  String clientId,
  String phone,
  String sourceMf
) {}