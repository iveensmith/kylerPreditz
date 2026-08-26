// Max points the AI may move confidence away from the base model's number, either direction.
export const MAX_ADJUSTMENT = 10;

// Never publish a confidence above this, regardless of what the model (or AI) produced.
export const CONFIDENCE_DISPLAY_CAP = 92;

// Fixtures grouped into a single Messages API call, per spec ("8-10 fixtures per call").
export const FIXTURES_PER_GROUP = 9;

export const DEFAULT_AI_MODEL = "claude-haiku-4-5";
