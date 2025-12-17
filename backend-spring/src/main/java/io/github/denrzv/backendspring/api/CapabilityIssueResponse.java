package io.github.denrzv.backendspring.api;

public record CapabilityIssueResponse(
  String capability,
  long expiresInSec
) {}