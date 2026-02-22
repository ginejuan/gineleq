import { programacionService } from "@/services/programacionService";
import ParteImpresion from "@/components/Programacion/ParteImpresion";
import { notFound } from "next/navigation";

// Definir el layout de la página directamente aquí para anular el genérico si fuera necesario.
// Pero dado que estamos en (protected), heredaremos el layout con el Sidebar.
// Para arreglar esto en Next.js App Router, lo ideal es ocultar el Sidebar basado en la ruta,
// o usar un layout diferente. 
// Una solución rápida es forzar a toda la página a tapar el sidebar mediante z-index y position en CSS global o en el wrapper css.
// El ParteImpresion.module.css ya tiene position flex con 100vh y background blanco, lo que 
// debería sobreponerse si lo diseñamos para ocupar el 100% fijo, pero lo integraremos de forma limpia.

export default async function PartePage(props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const { quirofano, pacientes } = await programacionService.getQuirofanoCompleto(params.id);

        if (!quirofano) {
            return notFound();
        }

        return (
            <ParteImpresion quirofano={quirofano} pacientes={pacientes} />
        );
    } catch (error) {
        console.error("Error cargando el parte de quirófano:", error);
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Error cargando el documento</h2>
                <p>No se ha podido recuperar la información del quirófano. {(error as Error).message}</p>
            </div>
        );
    }
}
