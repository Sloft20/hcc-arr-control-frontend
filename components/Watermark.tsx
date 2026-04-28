"use client";

// ============================================================
//  components/Watermark.tsx
//  Marca d'água de proteção de direitos autorais
//  Aparece em todas as telas do sistema
// ============================================================

export function Watermark() {
  return (
    <>
      {/* Marca diagonal central — visível mas sutil */}
      <div className="watermark-diagonal" aria-hidden="true">
        HCC ARR CONTROL
      </div>

      {/* Rodapé de direitos — canto inferior direito */}
      <div className="watermark" aria-hidden="true">
        <div style={{ fontWeight: 700, letterSpacing: ".5px" }}>© HCC Arr Control</div>
        <div>Desenvolvido por Thiago Elson</div>
        <div style={{ fontSize: "9px", marginTop: "2px", opacity: .7 }}>
          Todos os direitos reservados · {new Date().getFullYear()}
        </div>
        <div style={{ fontSize: "9px", opacity: .5 }}>
          Protótipo confidencial — uso interno
        </div>
      </div>
    </>
  );
}
