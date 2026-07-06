import { Btn } from "./Btn";
import { exportToExcel } from "../../utils/exportUtils";
import kmclogo from "../../assets/kmclogo.jpg";
import kmcslogan from "../../assets/kmcslogan.png";

export function ExportButton({
  data,
  fileName,
  headers,
  options = {},
  label = "Export to Excel",
  variant = "success",
  small = true,
  icon = "Download"
}) {
  const handleExport = async () => {
    const exportOptions = {
      logoUrl: kmclogo,
      sloganUrl: kmcslogan,
      ...options
    };
    await exportToExcel(data, fileName, headers, exportOptions);
  };

  return (
    <Btn
      onClick={handleExport}
      variant={variant}
      small={small}
      icon={icon}
    >
      {label}
    </Btn>
  );
}

