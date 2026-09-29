export {
  defineValueObject,
  type ValueObjectError,
  type ParseResult,
  type DefineValueObjectOptions,
  type ValueObjectDefinition,
} from "./base/index.js";

export { Email } from "./email/index.js";
export { Phone } from "./phone/index.js";
export { Cpf } from "./cpf/index.js";
export { Cnpj } from "./cnpj/index.js";
export { Name } from "./name/index.js";
export { Password, REDACTED } from "./password/index.js";
export {
  VideoFileName,
  asVideoFileName,
  ACCEPTED_VIDEO_EXTENSIONS,
} from "./video-file-name/index.js";
export { VideoFile, type VideoFileValue, type RawVideoFile } from "./video-file/index.js";
