// -----------------------------------------------------------------------------
// A failure shown to the user by Gladys. The core shows in green what an
// action handler returns and in red what it throws: every failure throws one
// of these, whose message is the text in the four languages.
// -----------------------------------------------------------------------------

export class ActionFailure extends Error {
  /** @param {{ en: string, fr: string, de: string, es: string }} text */
  constructor(text) {
    super(text.en);
    this.name = 'ActionFailure';
    this.message = text;
  }
}
