import { Animation, Node, UIOpacity, Vec3, tween } from 'cc';

export type InteractiveElementCallback = (node: Node, id: string) => void;

export class InteractiveElement {

    private static readonly callbacks = new Map<Node, (event: any) => void>();

    public static bind(
        node: Node,
        id: string,
        callback: InteractiveElementCallback,
    ): void {
        this.unbind(node);

        let clicked = false;
        const onClick = () => {
            if (clicked) {
                return;
            }

            clicked = true;
            node.off(Node.EventType.TOUCH_END, onClick, this);
            tween(node)
                .to(0.06, { scale: new Vec3(1.08, 1.08, 1) })
                .to(0.08, { scale: new Vec3(1, 1, 1) })
                .start();

            callback(node, id);
        };

        this.callbacks.set(node, onClick);
        node.on(Node.EventType.TOUCH_END, onClick, this);
    }

    public static unbind(node: Node): void {
        const callback = this.callbacks.get(node);
        if (!callback) {
            return;
        }

        node.off(Node.EventType.TOUCH_END, callback, this);
        this.callbacks.delete(node);
    }

    public static disappear(node: Node, duration: number = 0.2): void {
        if (!node || !node.isValid) {
            return;
        }

        this.unbind(node);
        tween(node).stop();

        const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
        tween(opacity).stop();
        opacity.opacity = 255;

        tween(node)
            .to(duration, { scale: new Vec3(0.7, 0.7, 1) }, { easing: 'sineIn' })
            .call(() => {
                node.active = false;
            })
            .start();

        tween(opacity)
            .to(duration, { opacity: 0 }, { easing: 'sineIn' })
            .start();
    }

    public static playAnimation(node: Node, clipName?: string): boolean {
        if (!node || !node.isValid) {
            return false;
        }

        const animation = node.getComponent(Animation)
            ?? node.getComponentInChildren(Animation);

        if (!animation) {
            console.warn('[InteractiveElement] 节点未找到 Animation:', node.name);
            return false;
        }

        if (clipName) {
            animation.play(clipName);
        } else {
            animation.play();
        }

        return true;
    }
}