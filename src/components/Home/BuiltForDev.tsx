import CodeIcon from '../../common/icons/CodeIcon';

interface PointFormStatementProps {
    stmt: string;
}

interface LinkButtonProps {
    className?: string;
    href: string;
    children: React.ReactNode;
}

const BUILT_FOR_DEV_FEATURES = [
    'Quick Integration: Simple SDK with TypeScript support and comprehensive examples',
    'Full Documentation: Step by step guide with real-world examples',
    'Open Source: Transparent roadmap and community contributions',
    'Backwards-compatible: Verify existing .oa documents while you migrate to W3C VC',
] as const;

const PointFormStatement = ({ stmt }: PointFormStatementProps) => (
    <div className="flex gap-2 items-center py-1">
        <div className="w-1.5 h-1.5 bg-trustvc-purple rounded-full flex-shrink-0" />
        <span>{stmt}</span>
    </div>
);

const LinkButton = ({ className = '', href, children }: LinkButtonProps) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`px-4 py-2 rounded-lg font-bold text-center ${className}`}
    >
        {children}
    </a>
);

const BuiltForDev = () => (
    <div className="px-4 sm:px-6 lg:px-8">
        <header className="flex flex-row gap-3 lg:gap-2 pb-3 items-start">
            <CodeIcon
                fontSize={36}
                className="border p-2 text-white rounded-lg bg-gradient-to-r from-trustvc-purple to-trustvc-blue flex-shrink-0"
            />
            <h2 className="flex flex-col lg:flex-row lg:gap-1 text-4xl font-bold font-roboto sm:px-2">
                <span>Built for Developers,</span>
                <span className="text-trustvc-purple">Trusted by Enterprises</span>
            </h2>
        </header>

        <div className="py-2 font-avenir text-gray-600">
            <p className="py-2 leading-snug text-xl">
                Get started in minutes with our comprehensive documentation. TrustVC abstracts away the complexity while maintaining full control and transparency.
            </p>

            <ul className="flex flex-col gap-2 m-2">
                {BUILT_FOR_DEV_FEATURES.map((feature) => (
                    <li key={feature}>
                        <PointFormStatement stmt={feature} />
                    </li>
                ))}
            </ul>

            <nav className="my-4 flex flex-col sm:flex-row gap-2">
                <LinkButton
                    className="bg-trustvc-button-purple text-white"
                    href="https://docs.tradetrust.io"
                >
                    TrustVC Documentation
                </LinkButton>
                <LinkButton
                    className="text-trustvc-button-purple"
                    href="https://github.com/TrustVC/trustvc"
                >
                    View on GitHub
                </LinkButton>
            </nav>
        </div>
    </div>
);

export default BuiltForDev;