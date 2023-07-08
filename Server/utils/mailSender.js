const nodemailer= require("nodemailer");

const mailSender = async (email,title,body)=>{
        try {
            const transporter =nodemailer.createTransport({
                host:process.env.MAIL_HOST,
                auth:{
                    user:process.env.MAIL_USER,
                    pass:process.env.MAIL_PASS
                }
            })


            let info= await transporter.sendMail({
                from:'Study Notion',
                to:`${email}`,
                subject:`${title}`,
                html:`${body}`
            })

            console.log(info);

            return info;
        } catch (error) {
            console.log("error while sending mail or otp in mailsender util")
            console.error(error);
            process.exit(1);
        }
}

module.exports = mailSender ;