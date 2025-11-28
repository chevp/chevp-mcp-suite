export interface AngularGuideline {
  rule: string;
  reason: string;
  badExample?: string;
  goodExample?: string;
}

export interface AngularGuidelinesCategory {
  title: string;
  guidelines: AngularGuideline[];
}

export const angularGuidelines: Record<string, AngularGuidelinesCategory> = {
  dependencyInjection: {
    title: 'Dependency Injection',
    guidelines: [
      {
        rule: 'Use inject() instead of constructor injection',
        reason: 'Cleaner, more readable, and type is automatically inferred. Also works with inheritance without super() calls.',
        badExample: `@Component({ ... })
export class MyComponent {
  constructor(
    private userService: UserService,
    private http: HttpClient,
    private router: Router
  ) {}
}`,
        goodExample: `@Component({ ... })
export class MyComponent {
  private userService = inject(UserService);
  private http = inject(HttpClient);
  private router = inject(Router);
}`,
      },
      {
        rule: 'Group inject() calls at the top of the class',
        reason: 'Consistent location makes dependencies easy to find and review.',
        goodExample: `@Component({ ... })
export class MyComponent {
  // Dependencies
  private userService = inject(UserService);
  private store = inject(Store);

  // State
  users = signal<User[]>([]);
}`,
      },
      {
        rule: 'Use inject() for DestroyRef instead of OnDestroy',
        reason: 'Works with takeUntilDestroyed() for automatic subscription cleanup.',
        badExample: `@Component({ ... })
export class MyComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.data$.pipe(takeUntil(this.destroy$)).subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}`,
        goodExample: `@Component({ ... })
export class MyComponent {
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.data$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}`,
      },
    ],
  },

  signals: {
    title: 'Signals & Reactivity',
    guidelines: [
      {
        rule: 'Prefer signals over BehaviorSubject for component state',
        reason: 'Signals are simpler, have better change detection, and work seamlessly with Angular templates.',
        badExample: `@Component({ ... })
export class MyComponent {
  private count$ = new BehaviorSubject<number>(0);
  count = this.count$.asObservable();

  increment() {
    this.count$.next(this.count$.value + 1);
  }
}`,
        goodExample: `@Component({ ... })
export class MyComponent {
  count = signal(0);

  increment() {
    this.count.update(c => c + 1);
  }
}`,
      },
      {
        rule: 'Use computed() for derived state',
        reason: 'Automatically tracks dependencies and updates only when needed.',
        goodExample: `@Component({ ... })
export class MyComponent {
  items = signal<Item[]>([]);
  filter = signal('');

  filteredItems = computed(() =>
    this.items().filter(item =>
      item.name.includes(this.filter())
    )
  );
}`,
      },
      {
        rule: 'Use effect() sparingly and only for side effects',
        reason: 'Effects should sync with external systems, not for computed values.',
        goodExample: `@Component({ ... })
export class MyComponent {
  theme = signal<'dark' | 'light'>('dark');

  constructor() {
    effect(() => {
      document.body.classList.toggle('dark', this.theme() === 'dark');
    });
  }
}`,
      },
    ],
  },

  components: {
    title: 'Component Architecture',
    guidelines: [
      {
        rule: 'Use standalone components by default',
        reason: 'Simpler architecture, better tree-shaking, no NgModule boilerplate.',
        goodExample: `@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: \`...\`
})
export class UserCardComponent {}`,
      },
      {
        rule: 'Prefer input() and output() functions over decorators',
        reason: 'Type-safe, supports transforms, and required inputs are enforced at compile time.',
        badExample: `@Component({ ... })
export class MyComponent {
  @Input() name: string = '';
  @Input() count!: number;
  @Output() clicked = new EventEmitter<void>();
}`,
        goodExample: `@Component({ ... })
export class MyComponent {
  name = input<string>('');
  count = input.required<number>();
  clicked = output<void>();
}`,
      },
      {
        rule: 'Use OnPush change detection',
        reason: 'Better performance, works great with signals and immutable data.',
        goodExample: `@Component({
  selector: 'app-my-component',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`...\`
})
export class MyComponent {}`,
      },
    ],
  },

  services: {
    title: 'Services & State',
    guidelines: [
      {
        rule: 'Use providedIn: root for singleton services',
        reason: 'Tree-shakeable, no need to add to providers array.',
        goodExample: `@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
}`,
      },
      {
        rule: 'Use functional guards and resolvers',
        reason: 'Simpler, no class boilerplate, inject() works directly.',
        badExample: `@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService) {}

  canActivate(): boolean {
    return this.auth.isLoggedIn();
  }
}`,
        goodExample: `export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn();
};`,
      },
    ],
  },

  templates: {
    title: 'Templates',
    guidelines: [
      {
        rule: 'Use new control flow syntax (@if, @for, @switch)',
        reason: 'Better performance, cleaner syntax, built-in empty states.',
        badExample: `<div *ngIf="users.length > 0; else empty">
  <div *ngFor="let user of users; trackBy: trackById">
    {{ user.name }}
  </div>
</div>
<ng-template #empty>No users</ng-template>`,
        goodExample: `@if (users().length > 0) {
  @for (user of users(); track user.id) {
    <div>{{ user.name }}</div>
  } @empty {
    <div>No users</div>
  }
}`,
      },
      {
        rule: 'Use @defer for lazy loading components',
        reason: 'Built-in loading states, better initial bundle size.',
        goodExample: `@defer (on viewport) {
  <app-heavy-component />
} @loading {
  <app-skeleton />
} @error {
  <p>Failed to load</p>
}`,
      },
    ],
  },
};

export const angularVersionInfo = {
  minimumVersion: '17.0',
  recommendedVersion: '18.0+',
  features: {
    inject: 'Angular 14+',
    signals: 'Angular 16+ (stable in 17)',
    inputOutput: 'Angular 17.1+',
    controlFlow: 'Angular 17+',
    defer: 'Angular 17+',
    standalone: 'Angular 14+ (default in 17)',
  },
};