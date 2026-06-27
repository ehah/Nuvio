import FileInput from "../input/FileInput";
import Label from "../Label";
export default function FileInputExample() {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Selected file:", file.name);
    }
  };
  return (
    <div
      data-nuvio-id="forms.fileInput.card"
      className="bg-white border border-green-300 rounded-md p-6 shadow-sm xl:bg-white xl:border xl:border-blue-300 xl:rounded-md xl:p-6 xl:shadow-sm dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div className="px-6 py-5">
        <h3
          data-nuvio-id="forms.fileInput.title"
          className="text-base font-medium text-green-600 xl:text-base xl:font-medium xl:text-purple-600 dark:text-white/90"
        >
          File Input
        </h3>
      </div>
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        <div>
          <Label data-nuvio-id="forms.fileInput.label">Upload file</Label>
          <FileInput
            onChange={handleFileChange}
            className="custom-class"
            data-nuvio-id="forms.fileInput.input"
          />
        </div>
      </div>
    </div>
  );
}
