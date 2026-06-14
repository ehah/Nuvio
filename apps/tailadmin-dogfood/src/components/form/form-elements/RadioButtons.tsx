import { useState } from "react";
import Radio from "../input/Radio";
export default function RadioButtons() {
  const [selectedValue, setSelectedValue] = useState<string>("option2");
  const handleRadioChange = (value: string) => {
    setSelectedValue(value);
  };
  return (
    <div
      data-nuvio-id="forms.radio.card"
      className="rounded-2xl border border-gray-200 bg-white xl:bg-white xl:border xl:border-gray-200 xl:rounded-md xl:p-6 xl:shadow-sm dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div className="px-6 py-5">
        <h3
          data-nuvio-id="forms.radio.title"
          className="text-base font-medium text-gray-800 xl:text-base xl:font-medium xl:text-green-600 dark:text-white/90"
        >
          Radio Buttons
        </h3>
      </div>
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        <div className="flex flex-wrap items-center gap-8">
          <Radio
            id="radio1"
            name="group1"
            value="option1"
            checked={selectedValue === "option1"}
            onChange={handleRadioChange}
            label="Default"
            data-nuvio-id="forms.radio.label"
          />
          <Radio
            id="radio2"
            name="group1"
            value="option2"
            checked={selectedValue === "option2"}
            onChange={handleRadioChange}
            label="Selected"
          />
          <Radio
            id="radio3"
            name="group1"
            value="option3"
            checked={selectedValue === "option3"}
            onChange={handleRadioChange}
            label="Disabled"
            disabled={true}
          />
        </div>
      </div>
    </div>
  );
}
