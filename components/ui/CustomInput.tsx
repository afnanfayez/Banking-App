import { Label } from "@radix-ui/react-label"
import { FormControl, FormField, FormLabel, FormMessage } from "./form"
import { Input } from "./input"
import {Control} from 'react-hook-form'
import {z} from 'zod'
import { authformSchema } from "@/lib/utils"



interface CustomInput {
  control:Control<z.infer<typeof authformSchema>> ,
   name :string ,
   label :string ,
   placeholder :string
}

const CustomInput =({control ,name ,label,placeholder}:CustomInput)=>{
    return (
      <FormField
                        control={control}
                        name={name}
                        render={({ field }) => (
                         <div className='form-item'>
                            <FormLabel className="form-label">
                                {label}
                                </FormLabel>
                                <div className="flex w-full flex-col" >
                                <FormControl >
                                    <Input placeholder={placeholder} className="input-class"
                                    {...field} />
                                </FormControl>
                                <FormMessage className="form-message mt-2" />
                                </div>
                         </div>
                        )}
                    />
    )
}

export default CustomInput