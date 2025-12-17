package io.github.denrzv.backendspring.api;

public record CallbackActionResponse(
  String status,
  String callId
) {}