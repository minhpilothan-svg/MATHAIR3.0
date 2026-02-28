const Router = {
    currentRoute: {
        page: 'home',
        params: {}
    },
    
    routes: {
        'home': 'renderHomePage',
        'grade': 'renderGradePage',
        'chapter': 'renderChapterPage',
        'quiz': 'renderQuizPage',
        'contest': 'renderContestQuizPage',
        'contest-result': 'renderContestResultPage',
        'profile': 'renderProfilePage',
        'login': 'renderLoginPage',
        'signup': 'renderSignupPage',
        'submit': 'renderSubmitPage'
    },
    
    navigate(page, params = {}) {
        this.currentRoute = { page, params };
        const url = this.buildURL(page, params);
        window.history.pushState({ page, params }, '', url);
        this.render();
    },
    
    buildURL(page, params) {
        if (page === 'home') return '/';
        let url = `#/${page}`;
        if (params.id) url += `/${params.id}`;
        return url;
    },
    
    parseURL() {
        const hash = window.location.hash.slice(1) || '/';
        const parts = hash.split('/').filter(p => p);
        
        // If no route specified and user is not logged in, show login page
        if (parts.length === 0) {
            if (!Auth.isLoggedIn()) {
                return { page: 'login', params: {} };
            }
            return { page: 'home', params: {} };
        }
        
        const page = parts[0];
        const params = {};
        if (parts[1]) {
            params.id = parts[1];
        }
        return { page, params };
    },
    
    render() {
        const route = this.currentRoute;
        const entry = this.routes[route.page];
        let renderFunc = null;
        if (typeof entry === 'string') {
            renderFunc = window[entry];
        } else if (typeof entry === 'function') {
            renderFunc = entry;
        }
        if (typeof renderFunc === 'function') {
            renderFunc(route.params);
        } else {
            const homeEntry = this.routes['home'];
            const homeFunc = typeof homeEntry === 'string' ? window[homeEntry] : homeEntry;
            if (typeof homeFunc === 'function') {
                this.currentRoute = { page: 'home', params: {} };
                homeFunc({});
            }
        }
    },
    
    handlePopState(event) {
        if (event.state) {
            this.currentRoute = event.state;
            this.render();
        } else {
            this.currentRoute = this.parseURL();
            this.render();
        }
    },
    
    init() {
        window.addEventListener('popstate', (e) => this.handlePopState(e));
        this.currentRoute = this.parseURL();
        this.render();
    }
};

function navigateTo(page, id = null) {
    const params = id ? { id } : {};
    Router.navigate(page, params);
}