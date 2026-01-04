"""Email service using Brevo (formerly Sendinblue) for transactional emails."""

import logging
from datetime import datetime
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending transactional emails via Brevo."""

    def __init__(self):
        self.api_key = settings.BREVO_API_KEY
        self.from_email = settings.EMAIL_FROM_ADDRESS
        self.from_name = settings.EMAIL_FROM_NAME
        self._api_instance = None

    def _get_api_instance(self):
        """Lazy-load the Brevo API instance."""
        if self._api_instance is None and self.api_key:
            try:
                import sib_api_v3_sdk
                from sib_api_v3_sdk.rest import ApiException

                configuration = sib_api_v3_sdk.Configuration()
                configuration.api_key["api-key"] = self.api_key
                self._api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
                    sib_api_v3_sdk.ApiClient(configuration)
                )
            except ImportError:
                logger.warning("sib-api-v3-sdk not installed")
        return self._api_instance

    async def send_booking_confirmation(
        self,
        to_email: str,
        to_name: str,
        service_title: str,
        booking_date: datetime,
        booking_time: str,
        amount: float,
        currency: str,
        booking_id: str,
        therapist_name: Optional[str] = None,
    ) -> bool:
        """
        Send a booking confirmation email.

        Returns True if email was sent successfully, False otherwise.
        """
        if not self.api_key:
            logger.warning("Brevo API key not configured - skipping email")
            return False

        api_instance = self._get_api_instance()
        if not api_instance:
            return False

        try:
            import sib_api_v3_sdk

            # Format date nicely
            date_formatted = booking_date.strftime("%A, %B %d, %Y")

            # Build email content
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Booking Confirmed! ✓</h1>
                </div>
                
                <div style="padding: 30px; background: #f8fafc;">
                    <p style="color: #334155; font-size: 16px;">Hi {to_name},</p>
                    <p style="color: #334155; font-size: 16px;">Your booking has been confirmed. Here are the details:</p>
                    
                    <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Service</td>
                                <td style="padding: 10px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">{service_title}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Date</td>
                                <td style="padding: 10px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">{date_formatted}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Time</td>
                                <td style="padding: 10px 0; color: #667eea; font-size: 14px; font-weight: 600; text-align: right;">{booking_time}</td>
                            </tr>
                            <tr style="border-top: 1px solid #e2e8f0;">
                                <td style="padding: 15px 0 10px; color: #64748b; font-size: 14px;">Amount Paid</td>
                                <td style="padding: 15px 0 10px; color: #16a34a; font-size: 18px; font-weight: 700; text-align: right;">{amount:.2f} {currency.upper()}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <p style="color: #64748b; font-size: 12px; text-align: center;">
                        Booking Reference: {booking_id[:8].upper()}
                    </p>
                </div>
                
                <div style="padding: 20px; text-align: center; background: #1e293b;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                        Thank you for your booking!
                    </p>
                </div>
            </div>
            """

            send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                to=[{"email": to_email, "name": to_name}],
                sender={"email": self.from_email, "name": self.from_name},
                subject=f"Booking Confirmed: {service_title}",
                html_content=html_content,
            )

            api_instance.send_transac_email(send_smtp_email)
            logger.info(f"Booking confirmation email sent to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False

    async def send_booking_cancelled(
        self,
        to_email: str,
        to_name: str,
        booking_date: datetime,
        booking_time: str,
        service_title: str,
        therapist_name: str,
        reason: Optional[str] = None,
    ) -> bool:
        """
        Send booking cancellation email to patient.

        Returns True if email was sent successfully, False otherwise.
        """
        if not self.api_key:
            logger.info(f"[DEMO MODE] Cancellation email would be sent to {to_email}")
            return True

        api_instance = self._get_api_instance()
        if not api_instance:
            return False

        try:
            import sib_api_v3_sdk

            date_formatted = booking_date.strftime("%A, %d de %B de %Y")
            reason_html = (
                f"""
                <p style="color: #64748b; font-size: 14px; font-style: italic; margin: 20px 0;">
                    Motivo: {reason}
                </p>
            """
                if reason
                else ""
            )

            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">KURA</h1>
                </div>
                
                <div style="padding: 30px; background: #f8fafc;">
                    <h2 style="color: #dc2626; margin-top: 0;">Cita Cancelada</h2>
                    <p style="color: #334155; font-size: 16px;">Hola {to_name},</p>
                    <p style="color: #334155; font-size: 16px;">
                        Lamentamos informarte que tu cita ha sido cancelada.
                    </p>
                    
                    <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Servicio</td>
                                <td style="padding: 10px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">{service_title}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Fecha</td>
                                <td style="padding: 10px 0; color: #1e293b; font-size: 14px; text-align: right;">{date_formatted}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Hora</td>
                                <td style="padding: 10px 0; color: #1e293b; font-size: 14px; text-align: right;">{booking_time}</td>
                            </tr>
                        </table>
                    </div>
                    
                    {reason_html}
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{settings.FRONTEND_URL}" style="background: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                            Reservar nueva cita
                        </a>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px;">
                        Atentamente,<br>
                        <strong>{therapist_name}</strong>
                    </p>
                </div>
                
                <div style="padding: 20px; text-align: center; background: #1e293b;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                        KURA OS - Sistema Operativo para Terapeutas
                    </p>
                </div>
            </div>
            """

            send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                to=[{"email": to_email, "name": to_name}],
                sender={"email": self.from_email, "name": self.from_name},
                subject=f"Cita Cancelada: {service_title}",
                html_content=html_content,
            )

            api_instance.send_transac_email(send_smtp_email)
            logger.info(f"Cancellation email sent to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send cancellation email: {e}")
            return False

    async def send_booking_rescheduled(
        self,
        to_email: str,
        to_name: str,
        old_date: datetime,
        old_time: str,
        new_date: datetime,
        new_time: str,
        service_title: str,
        therapist_name: str,
        reason: Optional[str] = None,
    ) -> bool:
        """
        Send booking reschedule email to patient.

        Returns True if email was sent successfully, False otherwise.
        """
        if not self.api_key:
            logger.info(f"[DEMO MODE] Reschedule email would be sent to {to_email}")
            return True

        api_instance = self._get_api_instance()
        if not api_instance:
            return False

        try:
            import sib_api_v3_sdk

            old_date_formatted = old_date.strftime("%A, %d de %B de %Y")
            new_date_formatted = new_date.strftime("%A, %d de %B de %Y")
            reason_html = (
                f"""
                <p style="color: #64748b; font-size: 14px; font-style: italic; margin: 20px 0;">
                    Motivo: {reason}
                </p>
            """
                if reason
                else ""
            )

            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">KURA</h1>
                </div>
                
                <div style="padding: 30px; background: #f8fafc;">
                    <h2 style="color: #f59e0b; margin-top: 0;">📅 Cita Reprogramada</h2>
                    <p style="color: #334155; font-size: 16px;">Hola {to_name},</p>
                    <p style="color: #334155; font-size: 16px;">
                        Tu cita ha sido movida a una nueva fecha.
                    </p>
                    
                    <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
                        <p style="color: #dc2626; font-size: 14px; text-decoration: line-through; margin-bottom: 15px;">
                            ❌ Antes: {old_date_formatted} a las {old_time}
                        </p>
                        <p style="color: #16a34a; font-size: 16px; font-weight: 600; margin: 0;">
                            ✓ Ahora: {new_date_formatted} a las {new_time}
                        </p>
                    </div>
                    
                    <div style="background: #f0fdf4; border-radius: 8px; padding: 15px; margin: 20px 0;">
                        <p style="color: #1e293b; font-size: 14px; margin: 0;">
                            <strong>Servicio:</strong> {service_title}
                        </p>
                    </div>
                    
                    {reason_html}
                    
                    <p style="color: #64748b; font-size: 14px;">
                        Si la nueva fecha no te viene bien, por favor contáctanos para encontrar otra alternativa.
                    </p>
                    
                    <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                        Atentamente,<br>
                        <strong>{therapist_name}</strong>
                    </p>
                </div>
                
                <div style="padding: 20px; text-align: center; background: #1e293b;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                        KURA OS - Sistema Operativo para Terapeutas
                    </p>
                </div>
            </div>
            """

            send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                to=[{"email": to_email, "name": to_name}],
                sender={"email": self.from_email, "name": self.from_name},
                subject=f"Cita Reprogramada: {service_title}",
                html_content=html_content,
            )

            api_instance.send_transac_email(send_smtp_email)
            logger.info(f"Reschedule email sent to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send reschedule email: {e}")
            return False

    async def send_automation_email(
        self,
        to_email: str,
        to_name: str,
        subject: str,
        template_type: str,
        context: dict,
    ) -> bool:
        """
        Send automation-triggered emails with inline HTML templates.

        Template types:
        - risk_alert: Alert therapist about high-risk patient
        - patient_accepted: Send payment link to approved patient
        - patient_blocked: Inform patient of manual review required

        Returns True if email sent, False otherwise.
        """
        # Build HTML based on template type
        if template_type == "risk_alert":
            patient_name = context.get("patient_name", "Unknown")
            flags = context.get("flags", [])
            flags_html = "".join([
                f"<li style='color: #dc2626;'>{f}</li>" for f in flags
            ])

            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #dc2626; padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🚨 ALERTA DE RIESGO</h1>
                </div>
                <div style="padding: 30px; background: #fef2f2; border: 2px solid #dc2626;">
                    <p style="color: #1e293b; font-size: 16px;">
                        Se ha detectado un postulante con <strong>indicadores de riesgo alto</strong>.
                    </p>
                    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <p><strong>Paciente:</strong> {patient_name}</p>
                        <p><strong>Indicadores detectados:</strong></p>
                        <ul>{flags_html if flags_html else "<li>Revisión manual requerida</li>"}</ul>
                    </div>
                    <p style="color: #64748b; font-size: 14px;">
                        <strong>Acción requerida:</strong> Revisa el perfil del paciente antes de autorizar cualquier pago.
                    </p>
                </div>
            </div>
            """

        elif template_type == "patient_accepted":
            name = context.get("name", "")
            payment_link = context.get("payment_link", "#")

            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🎉 ¡Estás dentro!</h1>
                </div>
                <div style="padding: 30px; background: #f0fdf4;">
                    <p style="color: #1e293b; font-size: 16px;">Hola {name},</p>
                    <p style="color: #334155; font-size: 16px;">
                        Has sido <strong>aprobado/a</strong> para participar. El siguiente paso es completar tu reserva.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{payment_link}" style="background: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                            Completar Reserva →
                        </a>
                    </div>
                    <p style="color: #64748b; font-size: 12px; text-align: center;">
                        Si tienes dudas, responde a este email.
                    </p>
                </div>
            </div>
            """

        elif template_type == "patient_blocked":
            name = context.get("name", "")

            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #f59e0b; padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">📋 Revisión en Proceso</h1>
                </div>
                <div style="padding: 30px; background: #fffbeb;">
                    <p style="color: #1e293b; font-size: 16px;">Hola {name},</p>
                    <p style="color: #334155; font-size: 16px;">
                        Gracias por tu interés. Tu aplicación requiere una <strong>revisión adicional</strong> por parte de nuestro equipo.
                    </p>
                    <p style="color: #334155; font-size: 16px;">
                        Te contactaremos en las próximas 24-48 horas.
                    </p>
                </div>
            </div>
            """

        elif template_type == "generic":
            # Generic automation email - uses body from context
            name = context.get("name", "")
            body = context.get("body", "")
            # Replace placeholders in body
            body = body.replace("{first_name}", name)

            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">✉️ Mensaje</h1>
                </div>
                <div style="padding: 30px; background: #f8fafc;">
                    <p style="color: #1e293b; font-size: 16px; white-space: pre-wrap;">{body}</p>
                </div>
                <div style="padding: 20px; text-align: center; background: #1e293b;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                        Este mensaje fue enviado desde KURA OS
                    </p>
                </div>
            </div>
            """
        elif template_type == "password_reset":
            user_name = context.get("user_name", "Usuario")
            reset_url = context.get("reset_url", "#")
            expires_hours = context.get("expires_hours", 1)

            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🔐 Recuperar Contraseña</h1>
                </div>
                <div style="padding: 30px; background: #f0fdf4;">
                    <p style="color: #1e293b; font-size: 16px;">Hola {user_name},</p>
                    <p style="color: #334155; font-size: 16px;">
                        Has solicitado restablecer tu contraseña. Haz clic en el botón para crear una nueva:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_url}" style="background: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                            Restablecer Contraseña
                        </a>
                    </div>
                    <p style="color: #64748b; font-size: 14px;">
                        Este enlace expira en <strong>{expires_hours} hora(s)</strong>.
                    </p>
                    <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
                        Si no solicitaste este cambio, ignora este email. Tu contraseña no será modificada.
                    </p>
                </div>
                <div style="padding: 20px; text-align: center; background: #1e293b;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                        KURA OS - Sistema Operativo para Terapeutas
                    </p>
                </div>
            </div>
            """
        else:
            logger.warning(f"Unknown email template type: {template_type}")
            return False

        # Check if API is configured
        if not self.api_key:
            logger.info(f"[DEMO MODE] Email would be sent to {to_email}: {subject}")
            logger.info(f"[DEMO MODE] Template: {template_type}, Context: {context}")
            return True  # Return True for demo mode

        api_instance = self._get_api_instance()
        if not api_instance:
            return False

        try:
            import sib_api_v3_sdk

            send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                to=[{"email": to_email, "name": to_name}],
                sender={"email": self.from_email, "name": self.from_name},
                subject=subject,
                html_content=html_content,
            )

            api_instance.send_transac_email(send_smtp_email)
            logger.info(f"Automation email sent to {to_email}: {subject}")
            return True

        except Exception as e:
            logger.error(f"Failed to send automation email: {e}")
            return False


# Singleton instance
email_service = EmailService()
