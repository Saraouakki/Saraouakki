import { getClients } from "@/lib/data";
import ClientsTable from "@/components/ClientsTable";
import NotionErrorPanel from "@/components/NotionErrorPanel";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  try {
    const clients = await getClients();

    return (
      <>
        <div className="page-header">
          <h1>Clients</h1>
          <p>{clients.length} client(s) enregistré(s).</p>
        </div>

        <ClientsTable clients={clients} />
      </>
    );
  } catch (error) {
    return (
      <>
        <div className="page-header">
          <h1>Clients</h1>
        </div>
        <NotionErrorPanel error={error} />
      </>
    );
  }
}
