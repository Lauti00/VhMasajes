package com.masajes.app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ChangePasswordRequest {

    @NotBlank
    private String passwordActual;

    @NotBlank
    @Size(min = 12, max = 72, message = "La nueva contraseña debe tener entre 12 y 72 caracteres.")
    private String passwordNuevo;

    @NotBlank
    private String passwordConfirmacion;

    public String getPasswordActual() { return passwordActual; }
    public void setPasswordActual(String passwordActual) { this.passwordActual = passwordActual; }
    public String getPasswordNuevo() { return passwordNuevo; }
    public void setPasswordNuevo(String passwordNuevo) { this.passwordNuevo = passwordNuevo; }
    public String getPasswordConfirmacion() { return passwordConfirmacion; }
    public void setPasswordConfirmacion(String passwordConfirmacion) { this.passwordConfirmacion = passwordConfirmacion; }
}
