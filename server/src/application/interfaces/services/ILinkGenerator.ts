export interface IPasswordResetLinkGenerator {
  generate(token: string): string;
}