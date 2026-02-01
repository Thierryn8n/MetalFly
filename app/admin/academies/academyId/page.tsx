export default function AcademyDetailPage({ params }: { params: { academyId: string } }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Detalhes da Escola</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie os detalhes da escola {params.academyId}
        </p>
      </div>
      
      <div className="rounded-lg border p-6">
        <p>Informações detalhadas da escola serão exibidas aqui</p>
      </div>
    </div>
  )
}