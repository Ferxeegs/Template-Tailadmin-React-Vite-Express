import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Checkbox from "../../components/form/input/Checkbox";

interface UserProfileTabProps {
  formData: {
    nim: string;
    major: string;
    faculty: string;
    room_number: string;
    is_verified: boolean;
  };
  onChange: (name: string, value: string | boolean) => void;
  isLoading: boolean;
}

export default function UserProfileTab({
  formData,
  onChange,
  isLoading,
}: UserProfileTabProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      onChange(name, checked);
    } else {
      onChange(name, value);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <Label>
          NIM <span className="text-error-500">*</span>
        </Label>
        <Input
          type="text"
          name="nim"
          value={formData.nim}
          onChange={handleChange}
          placeholder="Enter NIM"
          disabled={isLoading}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <Label>Major</Label>
          <Input
            type="text"
            name="major"
            value={formData.major}
            onChange={handleChange}
            placeholder="Enter major"
            disabled={isLoading}
          />
        </div>

        <div className="sm:col-span-1">
          <Label>Faculty</Label>
          <Input
            type="text"
            name="faculty"
            value={formData.faculty}
            onChange={handleChange}
            placeholder="Enter faculty"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <Label>Room Number</Label>
        <Input
          type="text"
          name="room_number"
          value={formData.room_number}
          onChange={handleChange}
          placeholder="Enter room number"
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          checked={formData.is_verified}
          onChange={(checked) => onChange('is_verified', checked)}
        />
        <Label className="mb-0">
          Profile Verified
        </Label>
      </div>
    </div>
  );
}

