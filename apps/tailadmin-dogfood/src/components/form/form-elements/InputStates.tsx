import { useState } from "react";
import Input from "../input/InputField";
import Label from "../Label";
export default function InputStates() {
  const [email, setEmail] = useState("");
  const [emailTwo, setEmailTwo] = useState("");
  const [error, setError] = useState(false);
  const validateEmail = (value: string) => {
    const isValidEmail =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
    setError(!isValidEmail);
    return isValidEmail;
  };
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };
  const handleEmailTwoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmailTwo(value);
    validateEmail(value);
  };
  return (
    <div
      data-nuvio-id="forms.states.card"
      className="bg-white border border-green-300 rounded-md p-6 shadow-sm xl:bg-white xl:border xl:border-blue-300 xl:rounded-md xl:p-6 xl:shadow-sm dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div className="px-6 py-5">
        <h3
          data-nuvio-id="forms.states.title"
          className="text-base font-medium text-green-600 xl:text-base xl:font-medium xl:text-purple-600 dark:text-white/90"
        >
          Input States
        </h3>
        <p
          data-nuvio-id="forms.states.desc"
          className="mt-1 text-sm font-normal text-green-600 dark:text-gray-400"
        >
          Validation styles for error, success and disabled states on form
          controls.
        </p>
      </div>
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        <div className="space-y-5 sm:space-y-6">
          <div>
            <Label data-nuvio-id="forms.states.label">Email</Label>
            <Input
              type="email"
              value={email}
              error={error}
              onChange={handleEmailChange}
              placeholder="Enter your email"
              hint={error ? "This is an invalid email address." : ""}
              data-nuvio-id="forms.states.input"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={emailTwo}
              success={!error}
              onChange={handleEmailTwoChange}
              placeholder="Enter your email"
              hint={!error ? "This is an success message." : ""}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="text"
              value="disabled@example.com"
              disabled={true}
              placeholder="Disabled email"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
