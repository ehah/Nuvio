import { useState } from "react";
import Checkbox from "../input/Checkbox";
export default function CheckboxComponents() {
  const [isChecked, setIsChecked] = useState(false);
  const [isCheckedTwo, setIsCheckedTwo] = useState(true);
  const [isCheckedDisabled, setIsCheckedDisabled] = useState(false);
  return (
    <div
      data-nuvio-id="forms.checkbox.card"
      className="bg-white border border-green-300 rounded-md p-6 shadow-sm xl:bg-white xl:border xl:border-blue-300 xl:rounded-md xl:p-6 xl:shadow-sm dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div className="px-6 py-5">
        <h3
          data-nuvio-id="forms.checkbox.title"
          className="text-base font-medium text-green-600 xl:text-base xl:font-medium xl:text-purple-600 dark:text-white/90"
        >
          Checkbox
        </h3>
      </div>
      <div className="border-t border-gray-100 p-4 dark:border-gray-800 sm:p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Checkbox checked={isChecked} onChange={setIsChecked} />
              <span
                data-nuvio-id="forms.checkbox.label"
                className="block text-sm font-medium text-gray-700 dark:text-gray-400"
              >
                Default
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isCheckedTwo}
                onChange={setIsCheckedTwo}
                label="Checked"
              />
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isCheckedDisabled}
                onChange={setIsCheckedDisabled}
                disabled
                label="Disabled"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
