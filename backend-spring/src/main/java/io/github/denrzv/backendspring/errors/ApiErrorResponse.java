package io.github.denrzv.backendspring.errors;

public record ApiErrorResponse(
  String reasonCode,
  String message
) {}