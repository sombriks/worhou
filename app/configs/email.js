export default {
  get emailUrl() {
    return process.env.EMAIL_API_URL ?? 'https://api.mailjet.com/v3.1/send';
  },
  get emailCredentials() {
    return Buffer.from(process.env.EMAIL_API_USERNAME + ':' + process.env.EMAIL_API_PASSWORD).toString('base64');
  },
  simpleTemplate({email, name, subject, body}) {
    return JSON.stringify({
      Messages: [
        {
          From: {
            Email: 'no-reply.worhou@sombriks.com.br',
            Name: 'WorHou Time!',
          },
          To: [
            {
              Email: email,
              Name: name,
            },
          ],
          Subject: subject,
          TextPart: body,
        },
      ],
    });
  },
};
