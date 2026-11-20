export interface CreatePaymentOrderInput { appointmentId: string; patientUserId: string; }
export interface VerifyAppointmentPaymentInput { appointmentId: string; patientUserId: string; orderId: unknown; paymentId: unknown; signature: unknown; }
export interface PaymentOrderDTO { appointmentId: string; orderId: string; amountMinor: number; currency: string; keyId: string; mode: "MOCK" | "RAZORPAY"; status: string; }
export interface PaymentStatusDTO { appointmentId: string; paymentStatus: string; appointmentStatus: string; refundReviewStatus?: "NOT_REQUIRED" | "PENDING_REVIEW"; }

export interface IPatientAppointmentPaymentsUseCase {
  createOrder(input: CreatePaymentOrderInput): Promise<PaymentOrderDTO>;
  verify(input: VerifyAppointmentPaymentInput): Promise<PaymentStatusDTO>;
  confirmTestPayment(input: CreatePaymentOrderInput): Promise<PaymentStatusDTO>;
  handleWebhook(rawBody: Buffer, signature: string, eventId?: string): Promise<void>;
  getStatus(appointmentId: string, patientUserId: string): Promise<PaymentStatusDTO>;
}
