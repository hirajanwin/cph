import { getLanguage, ocHide, ocAppend, ocShow } from '../utils';
import { Language } from '../types';
import { spawn } from 'child_process';
import path from 'path';
import { getSaveLocationPref } from '../preferences';

/**
 *  Get the location to save the generated binary in. If save location is
 *  available in preferences, returns that, otherwise returns the director of
 *  active file.
 *
 *  If it is a interpteted language, simply returns the path to the source code.
 *
 *  @param srcPath location of the source code
 */
export const getBinSaveLocation = (srcPath: string): string => {
    const language = getLanguage(srcPath);
    if (language.skipCompile) {
        return srcPath;
    }
    const savePreference = getSaveLocationPref();
    const srcFileName = path.basename(srcPath);
    const binFileName = `${srcFileName}.bin`;
    if (savePreference && savePreference !== '') {
        return path.join(savePreference, binFileName);
    }
    return `${srcPath}.bin`;
};

/**
 * Gets the complete lsit of required arguments to be passed to the compiler.
 * Loads additional args from preferences if available.
 *
 * @param language The Language object for the source code
 * @param srcPath location of the source code
 */
const getFlags = (language: Language, srcPath: string): string[] => {
    // The language.args are fetched from user saved preferences, if any.
    let args = language.args;
    if (args[0] === '') args = [];

    switch (language.name) {
        case 'cpp': {
            return [srcPath, '-o', getBinSaveLocation(srcPath), ...args];
        }
        case 'c': {
            return [srcPath, '-o', getBinSaveLocation(srcPath), ...args];
        }
        case 'rust': {
            return [srcPath, '-o', getBinSaveLocation(srcPath), ...args];
        }
        default: {
            return [];
        }
    }
};

/**
 * Compile a source file, storing the output binary in a location based on user
 * preferences. If `skipCompile` is true for a language, skips the compilation
 * and resolves true. If there is no preference, stores in the current
 * directory. Resolves true if it succeeds, false otherwise.
 *
 * @param srcPath location of the source code
 */
export const compileFile = (srcPath: string): Promise<boolean> => {
    console.log('Compilation Started');
    ocHide();
    const language: Language = getLanguage(srcPath);
    if (language.skipCompile) {
        return Promise.resolve(true);
    }
    const flags: string[] = getFlags(language, srcPath);
    console.log('Compiling with flags', flags);
    const result = new Promise<boolean>((resolve) => {
        const compiler = spawn(language.compiler, flags);
        let error = '';

        compiler.stderr.on('data', (data) => {
            error += data;
        });

        compiler.on('exit', (exitcode) => {
            if (exitcode === 1 || error !== '') {
                ocAppend('Errors while compiling:\n' + error);
                ocShow();
                console.error('Compilation failed');
                resolve(false);
                return;
            }
            console.log('Compilation passed');
            resolve(true);
            return;
        });
    });
    return result;
};
