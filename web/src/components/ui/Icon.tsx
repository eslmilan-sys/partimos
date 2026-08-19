/**
 * Jeu d'icônes — Lucide, au trait 1,9 px, `currentColor`, jamais d'émoji.
 *
 * Lucide et rien d'autre (demande du client) : un seul dessinateur pour
 * toutes les icônes, c'est ce qui fait qu'elles se ressemblent sans qu'on
 * sache dire pourquoi. L'API locale (`name`/`className`/`title`) est
 * conservée : les points d'appel n'ont pas bougé, seul le trait a changé
 * de main. Les import nommés se secouent à la compilation — on n'embarque
 * que les vingt icônes utilisées, pas la bibliothèque.
 *
 * Les icônes n'ont pas de couleur propre : elles héritent de celle du texte.
 * C'est ce qui empêche l'interface de se remplir de couleurs qui ne veulent
 * rien dire. Restent hors de ce fichier, et c'est voulu : le logo (une
 * marque n'est pas une icône) et les pictogrammes de paiement (Yappy est
 * une marque tierce, le billet « efectivo » est dessiné pour ne pas se lire
 * comme une carte bancaire).
 */

import {
  ArrowRight,
  ArrowUpDown,
  Banknote,
  Bell,
  Briefcase,
  Bus,
  Calendar,
  Camera,
  Car,
  Check,
  ChevronDown,
  Clock,
  Compass,
  Hash,
  LogOut,
  Mail,
  House,
  IdCard,
  MapPin,
  MessageSquare,
  Plus,
  PlusCircle,
  Route,
  Search,
  ShieldCheck,
  Smartphone,
  Star,
  User,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

const ICONS = {
  search: Search,
  chat: MessageSquare,
  car: Car,
  calendar: Calendar,
  camera: Camera,
  cash: Banknote,
  phone: Smartphone,
  id: IdCard,
  star: Star,
  pin: MapPin,
  user: User,
  userCircle: UserRound,
  users: Users,
  shield: ShieldCheck,
  route: Route,
  compass: Compass,
  hash: Hash,
  salir: LogOut,
  mail: Mail,
  clock: Clock,
  check: Check,
  chevronDown: ChevronDown,
  plus: Plus,
  plusCircle: PlusCircle,
  cross: X,
  arrowRight: ArrowRight,
  swap: ArrowUpDown,
  bus: Bus,
  bell: Bell,
  home: House,
  briefcase: Briefcase,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  className?: string;
  /** Une icône décorative est masquée aux lecteurs d'écran ; une icône
   *  porteuse de sens reçoit un titre. */
  title?: string;
};

export function Icon({ name, className = "size-5", title }: IconProps) {
  const Lucide = ICONS[name];
  return (
    <Lucide
      className={className}
      strokeWidth={1.9}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    />
  );
}
