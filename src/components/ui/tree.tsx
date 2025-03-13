import { Folder, File } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "./sidebar";
import { ChevronRight } from "lucide-react";

export type TTreeItem = {
  label: string;
  path: string;
};

export type TTreeMenu = TTreeItem & {
  menus: TTreeMenu[];
  items: TTreeItem[];
};

/**
 * Root of the Tree component for displaying a tree of folders and articles
 * @param items - The items to display
 * @returns A React component that displays the tree
 */
export const Tree = ({ items }: { items: TTreeMenu[] }) => {
  return (
    <SidebarMenu>
      {items.map((item, index) => (
        <TreeMenu key={`${item.label}-${index}`} item={item} />
      ))}
    </SidebarMenu>
  );
};

/**
 * TreeMenu component for displaying a single folder in the tree
 * @param item - The item to display
 * @returns A React component that displays the item - a branch of the tree
 */
export const TreeMenu = ({ item }: { item: TTreeMenu }) => {
  const { label, path, menus, items } = item;

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:last-child]:rotate-90"
        defaultOpen={false}
      >
        {/* Current Folder menu  */}
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="text-overflow-ellipsis overflow-hidden whitespace-nowrap">
            <Folder />
            <div className="text-overflow-ellipsis overflow-hidden whitespace-nowrap">
              {label} - {path}
            </div>
            <ChevronRight className="transition-transform ml-auto" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {/* Subfolders and articles */}
        <CollapsibleContent>
          {/* Subfolders */}
          <SidebarMenuSub>
            {menus.map((subItem, index) => (
              <TreeMenu key={`${subItem.label}-${index}`} item={subItem} />
            ))}
            {/* Articles */}
            {items.map((subItem, index) => (
              <TreeItem key={`${subItem.label}-${index}`} item={subItem} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
};

/**
 * TreeItem component for displaying a single item in the tree
 * @param item - The item to display
 * @returns A React component that displays the item - a leaf of the tree
 */
export const TreeItem = ({ item }: { item: TTreeItem }) => {
  const { label, path } = item;

  return (
    <SidebarMenuButton
      isActive={path === "button.tsx"}
      className="data-[active=true]:bg-transparent text-overflow-ellipsis overflow-hidden whitespace-nowrap"
    >
      <File />
      <div className="text-overflow-ellipsis overflow-hidden whitespace-nowrap">
        {label} - {path}
      </div>
    </SidebarMenuButton>
  );
};
