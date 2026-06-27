import { useState } from "react";
import Label from "../Label";
import Select from "../Select";
import MultiSelect from "../MultiSelect";
export default function SelectInputs() {
  const options = [
    {
      value: "marketing",
      label: "Marketing",
    },
    {
      value: "template",
      label: "Template",
    },
    {
      value: "development",
      label: "Development",
    },
  ];
  const handleSelectChange = (value: string) => {
    console.log("Selected value:", value);
  };
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const multiOptions = [
    {
      value: "1",
      text: "Option 1",
      selected: false,
    },
    {
      value: "2",
      text: "Option 2",
      selected: false,
    },
    {
      value: "3",
      text: "Option 3",
      selected: false,
    },
    {
      value: "4",
      text: "Option 4",
      selected: false,
    },
    {
      value: "5",
      text: "Option 5",
      selected: false,
    },
  ];
  return (
    <div
      data-nuvio-id="forms.select.card"
      className="bg-white border border-purple-300 rounded-md p-6 shadow-sm xl:bg-white xl:border xl:border-blue-300 xl:rounded-md xl:p-6 xl:shadow-sm dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div className="px-6 py-5">
        <h3
          data-nuvio-id="forms.select.title"
          className="text-base font-medium text-purple-600 xl:text-base xl:font-medium xl:text-purple-600 dark:text-white/90"
        >
          Select Inputs
        </h3>
      </div>
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        <div className="space-y-6">
          <div>
            <Label data-nuvio-id="forms.select.label">Select Input</Label>
            <Select
              options={options}
              placeholder="Select Option"
              onChange={handleSelectChange}
              className="dark:bg-dark-900"
              data-nuvio-id="forms.select.input"
            />
          </div>
          <div>
            <MultiSelect
              label="Multiple Select Options"
              options={multiOptions}
              defaultSelected={["1", "3"]}
              onChange={(values) => setSelectedValues(values)}
            />
            <p className="sr-only">
              Selected Values: {selectedValues.join(", ")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
