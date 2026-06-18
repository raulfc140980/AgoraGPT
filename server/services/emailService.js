import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({

    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Verify SMTP connection when server starts
transporter.verify(function (error, success) {

    if (error) {
        console.log("SMTP ERROR:");
        console.log(error);
    } else {
        console.log("SMTP READY");
    }

});

export const sendWelcomeEmail = async (
    email,
    name
) => {

    try {

        await transporter.sendMail({

            from: process.env.EMAIL_FROM,

            to: email,

            subject: "Welcome to AgoraGPT",

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin:auto;
                    padding:30px;
                    border:1px solid #ddd;
                    border-radius:10px;
                ">

                    <h1 style="color:#2563eb;">
                        Welcome to AgoraGPT
                    </h1>

                    <p>Hello ${name},</p>

                    <p>
                        Congratulations, you have successfully created
                        an account in AgoraGPT.
                    </p>

                    <p>
                        You can now use all the features of our app.
                    </p>

                    <p>
                        Thank you for joining us.
                    </p>

                    <br>

                    <p>
                        Regards,<br>
                        AgoraGPT Team
                    </p>

                </div>
            `
        });

        console.log(
            `Welcome email sent to ${email}`
        );

    } catch (error) {

        console.error("EMAIL ERROR");
        console.error(error);
        console.error(error.message);
    }
};