export interface BaseTemplateOptions {
  title: string;
  bodyHtml: string;
}

export const renderBaseTemplate = ({
  title,
  bodyHtml,
}: BaseTemplateOptions): string => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:24px 0;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background-color:#0f766e;padding:20px 32px;">
                <span style="color:#ffffff;font-size:20px;font-weight:bold;">ChiriKaro</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#1f2937;font-size:14px;line-height:22px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#f9fafb;color:#9ca3af;font-size:12px;">
                This is an automated message. Please do not reply to this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
