package io.github.denrzv.backendspring.errors;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {
  private final HttpStatus status;
  private final String reasonCode;

  public ApiException(HttpStatus status, String reasonCode, String message) {
    super(message);
    this.status = status;
    this.reasonCode = reasonCode;
  }

  public HttpStatus status() { return status; }
  public String reasonCode() { return reasonCode; }

  public static ApiException badRequest(String code, String msg) {
    return new ApiException(HttpStatus.BAD_REQUEST, code, msg);
  }
  public static ApiException forbidden(String code, String msg) {
    return new ApiException(HttpStatus.FORBIDDEN, code, msg);
  }
  public static ApiException tooMany(String code, String msg) {
    return new ApiException(HttpStatus.TOO_MANY_REQUESTS, code, msg);
  }
  public static ApiException conflict(String code, String msg) {
    return new ApiException(HttpStatus.CONFLICT, code, msg);
  }
}