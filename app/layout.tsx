import type {Metadata} from 'next';
import './globals.css';
import './professional.css';
export const metadata:Metadata={title:'BORROW — Your AI. Your rules.',description:'Give AI the access it needs. Nothing more. A zero-trust workspace with temporary permissions and verifiable privacy receipts.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
