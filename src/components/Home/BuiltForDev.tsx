import CodeIcon from '../../common/icons/CodeIcon';

const PointFormStatement = ({ stmt }: { stmt: string }) => {
    return (
        <div className='flex gap-2 items-center py-1'>
            <div className='w-1.5 h-1.5 bg-trustvc-purple rounded-full' />
            <span>{stmt}</span>
        </div>
    )
}

const LinkButton = ({ className, href, children }: { className?: string; href: string; children: React.ReactNode }) => {
    return (
        <a
            href={href}
            className={`px-4 py-2 rounded-lg font-bold ${className}`}
        >
            {children}
        </a>
    )
}

const BuiltForDev = () => {
    return (
        <div>
            <div className='flex gap-2 pb-3 items-center'>
                <CodeIcon fontSize={36} className='border p-2 text-white rounded-lg bg-gradient-to-r from-trustvc-purple to-trustvc-blue' />
                <div className='flex gap-1 text-3xl font-bold font-roboto px-2'>
                    <span >Built for Developers,</span>
                    <span className="text-trustvc-purple">Trusted by Enterprises</span>
                </div>
            </div>
            <div className='py-2 font-avenir'>
                <div className='py-2 leading-snug'>
                    <span>Get started in minutes with our comprehensive documentation. TrustVC abstracts away the complexity while maintaining full control and transparency.</span>
                </div>
                <div className='flex flex-col gap-2 m-2 text-sm'>
                    <PointFormStatement stmt="Quick Integration: Simple SDK with TypeScript support and comprehensive examples" />
                    <PointFormStatement stmt="Full Documentation: Step by step guide with real-world examples" />
                    <PointFormStatement stmt="Open Source: Transparent roadmap and community contributions" />
                    <PointFormStatement stmt="Backwards-compatible: Verify existing .oa documents while you migrate to W3C VC" />
                </div>
                <div className='my-4 flex gap-2'>
                    <LinkButton className="bg-trustvc-button-purple text-white" href="https://docs.tradetrust.io">TrustVC Documentation</LinkButton>
                    <LinkButton className="text-trustvc-button-purple" href="https://github.com/TrustVC/trustvc">View on GitHub</LinkButton>
                </div>
            </div>
        </div>
    )
}

export default BuiltForDev