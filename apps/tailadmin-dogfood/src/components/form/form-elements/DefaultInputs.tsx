import { useState } from "react";
import Label from "../Label";
import Input from "../input/InputField";
import Select from "../Select";
import { EyeCloseIcon, EyeIcon, TimeIcon } from "../../../icons";
import DatePicker from "../date-picker.tsx";
export default function DefaultInputs() {
  const [showPassword, setShowPassword] = useState(false);
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
  return (
    <div
      data-nuvio-id="forms.default.card"
      className="bg-white border border-rose-300 rounded-md p-6 xl:bg-white xl:border xl:border-gray-200 xl:rounded-md xl:p-6 xl:shadow-sm dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div className="px-6 py-5">
        <h3
          data-nuvio-id="forms.default.title"
          className="text-lg font-semibold text-rose-600 xl:text-base xl:font-medium xl:text-green-600 dark:text-white/90"
        >
          Default Inputs
        </h3>
      </div>
      <div className="border-t border-gray-100 p-4 dark:border-gray-800 sm:p-6">
        <div className="space-y-6">
          <div>
            <Label htmlFor="input" data-nuvio-id="forms.default.input.label">
              Input
            </Label>
            <Input type="text" id="input" data-nuvio-id="forms.default.input" />
          </div>
          <div>
            <label
              htmlFor="inputTwo"
              data-nuvio-id="form.email.label"
              className="mb-1.5 block text-sm font-medium text-gray-700 xl:text-sm xl:font-normal xl:text-blue-600 dark:text-gray-400"
            >
              Input with Placeholder
            </label>
            <input
              type="text"
              id="inputTwo"
              data-nuvio-id="form.email.input"
              placeholder="info@gmail.com"
              className="h-11 w-full text-sm text-gray-800 shadow-theme-xs bg-white border border-rose-300 rounded-md px-4 py-2 xl:bg-white xl:border xl:border-gray-200 xl:rounded-md xl:px-4 xl:py-2 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </div>
          <div>
            <Label>Select Input</Label>
            <Select
              options={options}
              placeholder="Select an option"
              onChange={handleSelectChange}
              className="dark:bg-dark-900"
            />
          </div>
          <div>
            <Label>Password Input</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
              >
                {showPassword ? (
                  <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                ) : (
                  <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <DatePicker
              id="date-picker"
              label="Date Picker Input"
              placeholder="Select a date"
              onChange={(dates, currentDateString) => {
                // Handle your logic
                console.log({
                  dates,
                  currentDateString,
                });
              }}
            />
          </div>

          <div>
            <Label htmlFor="tm">Time Picker Input</Label>
            <div className="relative">
              <Input
                type="time"
                id="tm"
                name="tm"
                onChange={(e) => console.log(e.target.value)}
              />
              <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                <TimeIcon className="size-6" />
              </span>
            </div>
          </div>
          <div>
            <Label htmlFor="tm">Input with Payment</Label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Card number"
                className="pl-[62px]"
              />
              <span className="absolute left-0 top-1/2 flex h-11 w-[46px] -translate-y-1/2 items-center justify-center border-r border-gray-200 dark:border-gray-800">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="6.25" cy="10" r="5.625" fill="#E80B26" />
                  <circle cx="13.75" cy="10" r="5.625" fill="#F59D31" />
                  <path
                    d="M10 14.1924C11.1508 13.1625 11.875 11.6657 11.875 9.99979C11.875 8.33383 11.1508 6.8371 10 5.80713C8.84918 6.8371 8.125 8.33383 8.125 9.99979C8.125 11.6657 8.84918 13.1625 10 14.1924Z"
                    fill="#FC6020"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
