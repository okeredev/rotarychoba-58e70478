import { Resend } from 'resend';

const resend = new Resend('re_h8Sn7FRn_KFD15drq7QDNxess9SUW9Ahk');

async function sendTest() {
  console.log("Sending test email to cryptobountiesupdates@gmail.com...");
  
  try {
    const response = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'cryptobountiesupdates@gmail.com',
      subject: 'Rotary Choba - Project Setup Test Email',
      html: '<p>Hello!</p><p>Your Resend API key is now successfully configured for the Rotary Choba project.</p><strong>It works!</strong>',
    });
    
    if (response.error) {
       console.error("Error sending:", response.error);
    } else {
       console.log("Success! Email sent. Response ID:", response.data?.id);
    }
  } catch (error) {
    console.error("Failed to send:", error.message);
  }
}

sendTest();
