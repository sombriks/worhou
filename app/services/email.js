import emailConfig from '#configs/email.js';

/**
 https://dev.mailjet.com/email/guides/send-api-v31/
 @param {{name:string,email:string,challenge:string}} parameters
 @returns {Promise<unknown>} send result
 */
export async function sendEmailChallenge(parameters) {
  // TODO send to a queue instead
  const body = `Hi, this is your login code: ${parameters.challenge}`;
  return await fetch(emailConfig.emailUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${emailConfig.emailCredentials}`,
    },
    body: emailConfig.simpleTemplate({...parameters, body}),
  });
}
