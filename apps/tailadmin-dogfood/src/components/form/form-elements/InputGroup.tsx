import Label from "../Label";
import Input from "../input/InputField";
import { EnvelopeIcon } from "../../../icons";
import PhoneInput from "../group-input/PhoneInput";
export default function InputGroup() {
  const countries = [
    {
      code: "US",
      label: "+1",
    },
    {
      code: "GB",
      label: "+44",
    },
    {
      code: "CA",
      label: "+1",
    },
    {
      code: "AU",
      label: "+61",
    },
  ];
  const handlePhoneNumberChange = (phoneNumber: string) => {
    console.log("Updated phone number:", phoneNumber);
  };
  return (
    <div
      data-nuvio-id="forms.inputGroup.card"
      className="rounded-2xl border border-gray-200 bg-white xl:bg-white xl:border xl:border-gray-200 xl:rounded-md xl:p-6 xl:shadow-sm dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div className="px-6 py-5">
        <h3
          data-nuvio-id="forms.inputGroup.title"
          className="text-base font-medium text-gray-800 xl:text-base xl:font-medium xl:text-green-600 dark:text-white/90"
        >
          Input Group
        </h3>
      </div>
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        <div className="space-y-6">
          <div>
            <Label data-nuvio-id="forms.inputGroup.label">Email</Label>
            <div className="relative">
              <Input
                placeholder="info@gmail.com"
                type="text"
                className="pl-[62px]"
                data-nuvio-id="forms.inputGroup.input"
              />
              <span className="absolute left-0 top-1/2 -translate-y-1/2 border-r border-gray-200 px-3.5 py-3 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <EnvelopeIcon className="size-6" />
              </span>
            </div>
          </div>
          <div>
            <Label>Phone</Label>
            <PhoneInput
              selectPosition="start"
              countries={countries}
              placeholder="+1 (555) 000-0000"
              onChange={handlePhoneNumberChange}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <PhoneInput
              selectPosition="end"
              countries={countries}
              placeholder="+1 (555) 000-0000"
              onChange={handlePhoneNumberChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
