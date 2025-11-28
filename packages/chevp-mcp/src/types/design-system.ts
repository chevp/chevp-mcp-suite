export interface DesignSystem {
  colors: ColorPalette;
  typography: Typography;
  components: ComponentStyles;
  layout: LayoutConfig;
}

export interface ColorPalette {
  arctic: Record<string, string>;
  categoryColors: Record<string, CategoryColor>;
  semantic: {
    background: string;
    surface: string;
    border: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    accent: string;
  };
}

export interface CategoryColor {
  gradient: string;
  text: string;
  border: string;
}

export interface Typography {
  fontFamily: string;
  sizes: Record<string, string>;
  weights: Record<string, number>;
}

export interface ComponentStyles {
  card: {
    glass: string;
    hover: string;
    border: string;
  };
  button: {
    filter: string;
    filterActive: string;
  };
  squircle: {
    small: string;
  };
}

export interface LayoutConfig {
  maxWidth: string;
  gridColumns: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  spacing: Record<string, string>;
}

export interface Repository {
  name: string;
  desc: string;
  url?: string;
  org: string;
}

export interface CategoryConfig {
  icon: string;
  color: string;
}

export interface HomepageData {
  projectData: Record<string, Repository[]>;
  categoryConfig: Record<string, CategoryConfig>;
}
