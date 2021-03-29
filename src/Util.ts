import {readdirSync, lstatSync, Stats} from "fs";
import {resolve, join} from "path";

export class Util {

	static getFilesRecursively(root: string, filter: (f: string, e: Stats) => boolean, result: string[]): string[] {
		const stats = lstatSync(resolve(root));
		if (filter(root, stats)) result.push(root);
		if (stats.isDirectory()) readdirSync(root).map(dir => Util.getFilesRecursively(join(root, dir), filter, result));
		return result;
	}

}
