import { useState } from "react";
import TextArea from "../input/TextArea";
import Label from "../Label";
export default function TextAreaInput() {
  const [message, setMessage] = useState("");
  const [messageTwo, setMessageTwo] = useState("");
  return (
    <div
      data-nuvio-id="forms.textarea.card"
      className="rounded-2xl border border-gray-200 bg-white xl:bg-white xl:border xl:border-gray-200 xl:rounded-md xl:p-6 xl:shadow-sm dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div className="px-6 py-5">
        <h3
          data-nuvio-id="forms.textarea.title"
          className="text-base font-medium text-gray-800 xl:text-base xl:font-medium xl:text-green-600 dark:text-white/90"
        >
          Textarea input field
        </h3>
      </div>
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        <div className="space-y-6">
          <div>
            <Label data-nuvio-id="forms.textarea.label">Description</Label>
            <TextArea
              value={message}
              onChange={(value) => setMessage(value)}
              rows={6}
              data-nuvio-id="forms.textarea.input"
            />
          </div>
          <div>
            <Label>Description</Label>
            <TextArea rows={6} disabled />
          </div>
          <div>
            <Label>Description</Label>
            <TextArea
              rows={6}
              value={messageTwo}
              error
              onChange={(value) => setMessageTwo(value)}
              hint="Please enter a valid message."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
