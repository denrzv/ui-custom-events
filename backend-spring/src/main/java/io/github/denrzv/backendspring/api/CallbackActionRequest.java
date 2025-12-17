package io.github.denrzv.backendspring.api;

public record CallbackActionRequest(
  String capability,
  String clientId,
  String phone
) {}