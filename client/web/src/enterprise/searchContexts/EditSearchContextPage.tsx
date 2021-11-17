import MagnifyIcon from 'mdi-react/MagnifyIcon'
import React, { useCallback, useMemo } from 'react'
import { RouteComponentProps } from 'react-router'
import { Observable, of, throwError } from 'rxjs'
import { catchError, startWith, switchMap } from 'rxjs/operators'

import { isErrorLike } from '@sourcegraph/codeintellify/lib/errors'
import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import {
    Scalars,
    SearchContextEditInput,
    SearchContextRepositoryRevisionsInput,
} from '@sourcegraph/shared/src/graphql-operations'
import { ISearchContext } from '@sourcegraph/shared/src/graphql/schema'
import { PlatformContextProps } from '@sourcegraph/shared/src/platform/context'
import { SearchContextProps } from '@sourcegraph/shared/src/search'
import { TelemetryProps } from '@sourcegraph/shared/src/telemetry/telemetryService'
import { ThemeProps } from '@sourcegraph/shared/src/theme'
import { asError } from '@sourcegraph/shared/src/util/errors'
import { useObservable } from '@sourcegraph/shared/src/util/useObservable'
import { Page } from '@sourcegraph/web/src/components/Page'
import { PageTitle } from '@sourcegraph/web/src/components/PageTitle'
import { PageHeader } from '@sourcegraph/wildcard'

import { AuthenticatedUser } from '../../auth'
import { withAuthenticatedUser } from '../../auth/withAuthenticatedUser'

import { SearchContextForm } from './SearchContextForm'

export interface EditSearchContextPageProps
    extends RouteComponentProps<{ spec: Scalars['ID'] }>,
        ThemeProps,
        TelemetryProps,
        Pick<SearchContextProps, 'updateSearchContext' | 'fetchSearchContextBySpec' | 'deleteSearchContext'>,
        PlatformContextProps<'requestGraphQL'> {
    authenticatedUser: AuthenticatedUser
}

export const AuthenticatedEditSearchContextPage: React.FunctionComponent<EditSearchContextPageProps> = props => {
    const LOADING = 'loading' as const

    const { match, updateSearchContext, fetchSearchContextBySpec } = props
    const onSubmit = useCallback(
        (
            id: Scalars['ID'] | undefined,
            searchContext: SearchContextEditInput,
            repositories: SearchContextRepositoryRevisionsInput[]
        ): Observable<ISearchContext> => {
            if (!id) {
                return throwError(new Error('Cannot update search context with undefined ID'))
            }
            return updateSearchContext({ id, searchContext, repositories }, props.platformContext)
        },
        [updateSearchContext, props.platformContext]
    )

    const searchContextOrError = useObservable(
        useMemo(
            () =>
                fetchSearchContextBySpec(match.params.spec, props.platformContext).pipe(
                    switchMap(searchContext => {
                        if (!searchContext.viewerCanManage) {
                            return throwError(new Error('You do not have sufficient permissions to edit this context.'))
                        }
                        return of(searchContext)
                    }),
                    startWith(LOADING),
                    catchError(error => [asError(error)])
                ),
            [match.params.spec, fetchSearchContextBySpec, props.platformContext]
        )
    )

    return (
        <div className="w-100">
            <Page>
                <div className="container col-8">
                    <PageTitle title="Edit context" />
                    <PageHeader
                        className="mb-3"
                        path={[
                            {
                                icon: MagnifyIcon,
                                to: '/search',
                            },
                            {
                                to: '/contexts',
                                text: 'Contexts',
                            },
                            {
                                text: 'Edit context',
                            },
                        ]}
                    />
                    {searchContextOrError === LOADING && (
                        <div className="d-flex justify-content-center">
                            <LoadingSpinner />
                        </div>
                    )}
                    {searchContextOrError && searchContextOrError !== LOADING && !isErrorLike(searchContextOrError) && (
                        <SearchContextForm {...props} searchContext={searchContextOrError} onSubmit={onSubmit} />
                    )}
                    {isErrorLike(searchContextOrError) && (
                        <div className="alert alert-danger">
                            Error while loading the search context: <strong>{searchContextOrError.message}</strong>
                        </div>
                    )}
                </div>
            </Page>
        </div>
    )
}

export const EditSearchContextPage = withAuthenticatedUser(AuthenticatedEditSearchContextPage)
