/** JSON that is safe to put inside a <script> tag (it can't close the tag early). */
export const safeJson = (value: unknown) =>
  JSON.stringify(value).replace(/[<\u2028\u2029]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
