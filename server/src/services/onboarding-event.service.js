import OnboardingEvent from "../models/OnboardingEvent.js";

export async function trackOnboardingEvent({
  organizationId = null,
  demoRequestId = null,
  userId = null,
  eventType,
  stage = "",
  actorRole = "",
  metadata = {},
}) {
  if (!eventType) return null;

  try {
    return await OnboardingEvent.create({
      organizationId,
      demoRequestId,
      userId,
      eventType,
      stage,
      actorRole,
      metadata,
    });
  } catch (error) {
    console.warn("[OnboardingEvent] Failed to record event:", error.message);
    return null;
  }
}
