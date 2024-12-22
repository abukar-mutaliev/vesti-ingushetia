import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        textAlign: 'center',
                        color: 'red',
                        height: '80vh',
                        minHeight: '80vh',
                        lineHeight: '80vh',
                        marginTop: '20%',
                    }}
                >
                    <h1>Что-то пошло не так.</h1>
                </div>
            );
        }

        return this.props.children;
    }
}
