import Head from 'next/head';
import App from '../App';

export default function Home() {
    return (
        <>
            <Head>
                <title>FitComm Tracker</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>
            <App />
        </>
    );
}
