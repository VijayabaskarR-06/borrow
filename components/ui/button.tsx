import * as React from 'react';
import {Slot} from 'radix-ui';
import {cva,type VariantProps} from 'class-variance-authority';
import {clsx} from 'clsx';
const variants=cva('button',{variants:{variant:{default:'button-primary',secondary:'button-secondary',ghost:'button-ghost',danger:'button-danger'},size:{default:'',sm:'button-small',icon:'button-icon'}},defaultVariants:{variant:'default',size:'default'}});
export function Button({className,variant,size,asChild=false,...props}:React.ComponentProps<'button'>&VariantProps<typeof variants>&{asChild?:boolean}){const Comp=asChild?Slot.Root:'button';return <Comp className={clsx(variants({variant,size}),className)} {...props}/>}
