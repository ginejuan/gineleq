import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const pdfFile = formData.get('pdf') as File;
        const to = formData.get('to') as string; // Comma separated emails
        const cc = formData.get('cc') as string | null;
        const subject = formData.get('subject') as string;
        const text = formData.get('text') as string;

        // Validar que al menos haya un destinatario (to o cc)
        if (!pdfFile || (!to && !cc)) {
            return NextResponse.json(
                { error: 'Faltan parámetros requeridos (pdf) o no hay destinatarios' },
                { status: 400 }
            );
        }

        // Leer credenciales SMTP
        const host = process.env.SMTP_HOST;
        const port = parseInt(process.env.SMTP_PORT || '587', 10);
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASSWORD;
        const from = process.env.SMTP_FROM || user;

        if (!host || !user || !pass) {
            console.error('[SMTP] Credenciales no configuradas (SMTP_HOST, SMTP_USER, SMTP_PASSWORD)');
            return NextResponse.json(
                { error: 'El servicio de correo no está configurado en el servidor.' },
                { status: 500 }
            );
        }

        // Convert File to Buffer
        const arrayBuffer = await pdfFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Configurar Nodemailer
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465, // true for 465, false for other ports
            auth: { user, pass },
            tls: {
                // Do not fail on invalid certs for academic networks
                rejectUnauthorized: false
            },
            connectionTimeout: 10000, // 10 seconds to connect
            greetingTimeout: 10000,
            socketTimeout: 10000
        });

        // Configurar MailOptions
        const mailOptions: any = {
            from,
            // Si no hay "to", nos enviamos el correo a nosotros mismos como principal
            // para que pasen los filtros anti-spam, y el resto va todo en CC.
            to: (to && to.trim() !== '') ? to : from,
            subject: subject || 'Parte de Quirófano - GineLeq',
            text: text || 'Adjunto se envía el Parte de Quirófano generado desde GineLeq.',
            attachments: [
                {
                    filename: pdfFile.name || 'Parte_Quirofano.pdf',
                    content: buffer
                }
            ]
        };

        if (cc && cc.trim() !== '') {
            mailOptions.cc = cc;
        }

        // Enviar Correo
        const info = await transporter.sendMail(mailOptions);

        console.log('[SMTP] Ccorreo enviado: %s', info.messageId);

        return NextResponse.json({ success: true, messageId: info.messageId });

    } catch (error: any) {
        console.error('[SMTP] Error enviando correo:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor al enviar el correo.' },
            { status: 500 }
        );
    }
}
